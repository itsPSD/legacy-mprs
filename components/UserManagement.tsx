"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

interface User {
  _id: string;
  discordId: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  characterName?: string;
  cid?: string;
  image?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const ROLE_HIERARCHY = [
    "pending",
    "intern mechanic", 
    "mechanic", 
    "lead mechanic", 
    "expert mechanic", 
    "veteran mechanic", 
    "manager", 
    "boss", 
    "root"
  ];

  const [currentUserRole, setCurrentUserRole] = useState<string>("pending");

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      try {
        const response = await axios.get("/api/auth/session");
        setCurrentUserRole(response.data?.user?.role || "pending");
      } catch (error) {
        console.error("Error fetching current user role:", error); // eslint-disable-line no-console
      }
    };

    fetchCurrentUserRole();
  }, []);

  const canChangeRole = (currentRole: string, targetRole: string) => {
    // Root can change any role
    if (currentUserRole === "root") return true;

    // Get indices of current and target roles
    const currentRoleIndex = ROLE_HIERARCHY.indexOf(currentUserRole);
    const targetRoleIndex = ROLE_HIERARCHY.indexOf(targetRole);

    // Boss can change roles lower than their own
    if (currentUserRole === "boss") {
      return targetRoleIndex < currentRoleIndex;
    }

    // Manager can change roles lower than their own
    if (currentUserRole === "manager") {
      return targetRoleIndex < currentRoleIndex;
    }

    // Others cannot change roles
    return false;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error); // eslint-disable-line no-console
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await axios.put(`/api/users/${userId}/approve`);
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error); // eslint-disable-line no-console
    }
  };

  const handleToggleAccess = async (userId: string) => {
    try {
      await axios.put(`/api/users/${userId}/toggle-access`);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user access:", error); // eslint-disable-line no-console
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await axios.put(`/api/users/${userId}/change-role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error("Error changing user role:", error); // eslint-disable-line no-console
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-lg border border-orange-500/20 p-6 rounded-xl shadow-[0_8px_30px_rgba(251,146,60,0.1)]">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 text-transparent bg-clip-text">
        User Management
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-orange-100 text-sm">
          <thead>
            <tr className="bg-black/60">
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Avatar
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Discord ID
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Username
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Character
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                CID
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Role
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Status
              </th>
              <th className="px-4 py-2 text-left text-white font-medium uppercase tracking-wider border-b border-orange-500/20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-500/20">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-orange-500/5 transition-colors duration-150">
                <td className="text-white px-4 py-2">
                  <Image 
                    src={user.image || "https://cdn.discordapp.com/embed/avatars/0.png"} 
                    alt={`${user.name}'s avatar`}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </td>
                <td className="text-white px-4 py-2">{user.discordId || "N/A"}</td>
                <td className="text-white px-4 py-2">{user.name}</td>
                <td className="text-white px-4 py-2">{user.characterName || "N/A"}</td>
                <td className="text-white px-4 py-2">{user.cid || "N/A"}</td>
                <td className="text-white px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      if (canChangeRole(user.role, newRole)) {
                        handleChangeRole(user._id, newRole);
                      } else {
                        alert("You do not have permission to change this role.");
                      }
                    }}
                    className={`rounded-lg border border-orange-500/20 bg-black/40 text-orange-100 py-1 px-2 text-sm focus:outline-none focus:border-orange-500/40 transition-colors duration-200 ${
                      ROLE_HIERARCHY.indexOf(user.role) < ROLE_HIERARCHY.indexOf(currentUserRole) 
                        ? "opacity-50 cursor-not-allowed" 
                        : ""
                    }`}
                  >
                    {ROLE_HIERARCHY.map((role, index) => (
                      <option key={index} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td className="text-white px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isApproved 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {user.isApproved ? "Approved" : "Not Approved"}
                  </span>
                </td>
                <td className="text-white px-4 py-2 ">
                  {user.role === "pending" && (
                    <button
                      onClick={() => handleApprove(user._id)}
                      className={`px-3 py-1 rounded-md ${
                        user.isApproved ? "bg-green-500/20" : "bg-orange-500/20"
                      } hover:bg-opacity-30 transition-colors duration-150`}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleAccess(user._id)}
                    className={`bg-black/40 border ${
                      user.isApproved
                        ? "border-red-500/40 hover:border-red-500 text-red-400"
                        : "border-green-500/40 hover:border-green-500 text-green-400"
                    } text-sm py-1 px-3 rounded-lg transition-colors duration-200`}
                  >
                    {user.isApproved ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}