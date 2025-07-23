import React from 'react';
import type { User } from '../../types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base', 
    lg: 'h-12 w-12 text-lg'
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.firstname} ${user.lastname}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-srh-blue text-white flex items-center justify-center font-medium ${className}`}
    >
      {getInitials(user.firstname, user.lastname)}
    </div>
  );
};

export default UserAvatar;