import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, User, Stethoscope, Crown } from 'lucide-react';
import { customToast } from '@/lib/toast';

interface UserRoleManagerProps {
  userId: number;
  currentRole: string;
  onRoleChange?: () => void;
}

const UserRoleManager: React.FC<UserRoleManagerProps> = ({ 
  userId, 
  currentRole,
  onRoleChange 
}) => {
  const { user, changeUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (!user || user.role !== 'admin') {
      customToast.error('Only admin can change user roles');
      return;
    }

    setIsLoading(true);
    try {
      await changeUserRole(userId, newRole as any);
      customToast.success(`Role changed to ${newRole}`);
      onRoleChange?.();
    } catch (error) {
      customToast.error('Failed to change role');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'assistant':
        return <Stethoscope className="h-4 w-4" />;
      case 'premium':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'assistant':
        return 'Assistant';
      case 'premium':
        return 'Premium';
      default:
        return 'User';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center gap-2">
        {getRoleIcon(currentRole)}
        <span className="text-sm font-medium">{getRoleLabel(currentRole)}</span>
      </div>
    );
  }

  return (
    <Select 
      value={currentRole} 
      onValueChange={handleRoleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            {getRoleIcon(currentRole)}
            <span>{getRoleLabel(currentRole)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>User</span>
          </div>
        </SelectItem>
        <SelectItem value="premium">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span>Premium</span>
          </div>
        </SelectItem>
        <SelectItem value="assistant">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Assistant</span>
          </div>
        </SelectItem>
        <SelectItem value="admin">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default UserRoleManager; 