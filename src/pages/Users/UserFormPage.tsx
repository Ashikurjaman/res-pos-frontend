// src/pages/Users/UserFormPage.tsx
import { useNavigate, useParams } from "react-router-dom";
import UserForm from "../../components/users/UserForm";

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userId = id ? parseInt(id, 10) : undefined;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {userId ? "Edit User" : "Create New User"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {userId
            ? "Update user details, role, and permissions."
            : "Fill in the details to create a new user."}
        </p>
      </div>

      <UserForm
        userId={userId}
        onSuccess={() => navigate("/users")}
        onCancel={() => navigate("/users")}
      />
    </div>
  );
}
