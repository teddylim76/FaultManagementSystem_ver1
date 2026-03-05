import { FailureRecord, NetworkConfig, Stats, User } from "../types";

const API_BASE = "/api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    signup: async (username: string, password: string, role: string) => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      if (!res.ok) throw new Error("Signup failed");
      return res.json();
    },
    getUsers: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    deleteUser: async (id: number) => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
      return res.json();
    },
    updateUser: async (id: number, data: any) => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
  },
  network: {
    getAll: async (): Promise<NetworkConfig[]> => {
      const res = await fetch(`${API_BASE}/network`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch network configs");
      return res.json();
    },
    auto: async () => {
      const res = await fetch(`${API_BASE}/network/auto`, {
        method: "POST",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to register network config automatically");
      return res.json();
    },
    create: async (config: Partial<NetworkConfig>) => {
      const res = await fetch(`${API_BASE}/network`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to add network config");
      return res.json();
    },
    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/network/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete network config");
      return res.json();
    },
  },
  records: {
    getAll: async (): Promise<FailureRecord[]> => {
      const res = await fetch(`${API_BASE}/records`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
    create: async (record: Partial<FailureRecord>) => {
      const res = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error("Failed to create record");
      return res.json();
    },
    update: async (id: number, record: Partial<FailureRecord>) => {
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error("Failed to update record");
      return res.json();
    },
    delete: async (id: number) => {
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete record");
      return res.json();
    },
  },
  stats: {
    get: async (): Promise<Stats> => {
      const res = await fetch(`${API_BASE}/stats`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  },
};
