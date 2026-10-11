import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_PERMISSIONS = [
  "people.read",
  "people.update",
  "people.delete",
  "audit_logs.view",
] as const;

type AllowedPermission = (typeof ALLOWED_PERMISSIONS)[number];

type CreateAdminRequest = {
  email?: string;
  permissions?: string[];
};

function createErrorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase server environment variables are missing.");

    return createErrorResponse(
      "Server configuration is incomplete. Please contact the system administrator.",
      500
    );
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!accessToken) {
    return createErrorResponse(
      "You must be logged in to perform this action.",
      401
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify the caller's Supabase authentication token.
  const {
    data: { user: currentUser },
    error: authenticationError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authenticationError || !currentUser) {
    return createErrorResponse(
      "Your session is invalid or has expired. Please sign in again.",
      401
    );
  }

  // Confirm that the caller is an existing Super Admin.
  const { data: currentAdmin, error: currentAdminError } =
    await supabaseAdmin
      .from("admin_users")
      .select("id, user_id, role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (currentAdminError) {
    console.error("Unable to verify administrator:", currentAdminError);

    return createErrorResponse(
      "Unable to verify your administrator access.",
      500
    );
  }

  if (!currentAdmin || currentAdmin.role !== "super_admin") {
    return createErrorResponse(
      "Only the Super Admin can create administrator accounts.",
      403
    );
  }

  // Validate the submitted information.
  let body: CreateAdminRequest;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254) {
    return createErrorResponse("Please provide a valid email address.", 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return createErrorResponse("Please provide a valid email address.", 400);
  }

  if (
    !Array.isArray(body.permissions) ||
    body.permissions.length === 0 ||
    body.permissions.some(
      (permission) =>
        typeof permission !== "string" ||
        !ALLOWED_PERMISSIONS.includes(permission as AllowedPermission)
    )
  ) {
    return createErrorResponse(
      "Select at least one valid administrator permission.",
      400
    );
  }

  const permissions = [
    ...new Set(body.permissions),
  ] as AllowedPermission[];

  // Check whether this email already belongs to an administrator.
  const { data: existingAdmins, error: existingAdminError } =
    await supabaseAdmin
      .from("admin_users")
      .select("id, user_id")
      .limit(500);

  if (existingAdminError) {
    console.error("Unable to check existing administrators:", existingAdminError);

    return createErrorResponse(
      "Unable to check existing administrator accounts.",
      500
    );
  }

  if (existingAdmins?.some((admin) => admin.user_id === currentUser.id)) {
    // This check does not block the current Super Admin from inviting others.
    // It simply confirms the existing account remains intact.
  }

  // Find existing Supabase accounts so that we do not invite an account
  // that already exists. A paginated Auth lookup avoids relying on a
  // browser-supplied user ID.
  let page = 1;
  let existingAuthUser: { id: string; email?: string } | null = null;

  while (true) {
    const { data: authUsers, error: authUsersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });

    if (authUsersError) {
      console.error("Unable to check authentication users:", authUsersError);

      return createErrorResponse(
        "Unable to verify whether this email already has an account.",
        500
      );
    }

    const match = authUsers.users.find(
      (user) => user.email?.toLowerCase() === email
    );

    if (match) {
      existingAuthUser = {
        id: match.id,
        email: match.email,
      };
      break;
    }

    if (authUsers.users.length < 100) {
      break;
    }

    page += 1;
  }

  if (existingAuthUser) {
    return createErrorResponse(
      "An account with this email already exists. Use the existing account-management process instead.",
      409
    );
  }

  // Invite the new administrator through Supabase Auth.
  // The recipient sets up their own account through the invitation email.
  const { data: invitation, error: invitationError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  if (invitationError || !invitation.user) {
    console.error("Administrator invitation failed:", invitationError);

    return createErrorResponse(
      "The administrator invitation could not be sent. Check your Supabase Auth email configuration and try again.",
      500
    );
  }

  const invitedUserId = invitation.user.id;

  // Register the invited user in the existing admin_users table.
  // New accounts are deliberately assigned the ordinary admin role,
  // never super_admin.
  const { data: newAdmin, error: newAdminError } = await supabaseAdmin
    .from("admin_users")
    .insert({
      user_id: invitedUserId,
      role: "admin",
    })
    .select("id, user_id, role")
    .single();

  if (newAdminError || !newAdmin) {
    console.error("Unable to create admin_users record:", newAdminError);

    // Remove the invited Auth user if the database registration fails.
    const { error: cleanupError } =
      await supabaseAdmin.auth.admin.deleteUser(invitedUserId);

    if (cleanupError) {
      console.error("Failed to clean up invited Auth user:", cleanupError);
    }

    return createErrorResponse(
      "The administrator record could not be created.",
      500
    );
  }

  // Assign the selected permissions to the new administrator.
  const permissionRows = permissions.map((permission) => ({
    admin_user_id: newAdmin.id,
    permission,
    granted_by: currentAdmin.id,
  }));

  const { error: permissionsError } = await supabaseAdmin
    .from("admin_permissions")
    .insert(permissionRows);

  if (permissionsError) {
    console.error("Unable to assign administrator permissions:", permissionsError);

    // Roll back the database record and Auth invitation if permission
    // assignment fails.
    await supabaseAdmin
      .from("admin_permissions")
      .delete()
      .eq("admin_user_id", newAdmin.id);

    await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", newAdmin.id);

    const { error: cleanupError } =
      await supabaseAdmin.auth.admin.deleteUser(invitedUserId);

    if (cleanupError) {
      console.error("Failed to clean up invited Auth user:", cleanupError);
    }

    return createErrorResponse(
      "The administrator was not fully configured because permission assignment failed.",
      500
    );
  }

  // Record the action in the existing audit_logs table.
  const { error: auditError } = await supabaseAdmin
    .from("audit_logs")
    .insert({
      admin_email: currentUser.email ?? "Unknown administrator",
      action: "CREATE_ADMIN",
      target_id: newAdmin.id,
      details: `Invited ${email} as admin with permissions: ${permissions.join(", ")}`,
    });

  if (auditError) {
    console.error("Administrator created, but audit logging failed:", auditError);
  }

  return NextResponse.json(
    {
      success: true,
      message: auditError
        ? "Administrator invited successfully, but the audit log could not be saved."
        : "Administrator invited successfully.",
      administrator: {
        id: newAdmin.id,
        email,
        role: newAdmin.role,
        permissions,
      },
    },
    { status: 201 }
  );
}