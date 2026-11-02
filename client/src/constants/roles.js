export const ROLES = {
  CITIZEN: 'CITIZEN',
  OPERATOR: 'OPERATOR',
  ENGINEER: 'ENGINEER',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.OPERATOR]: 'Municipality Operator',
  [ROLES.ENGINEER]: 'Joint Engineer',
  [ROLES.ADMIN]: 'System Administrator',
};

export const ROLE_DASHBOARD_ROUTES = {
  [ROLES.CITIZEN]: '/citizen/dashboard',
  [ROLES.OPERATOR]: '/operator/dashboard',
  [ROLES.ENGINEER]: '/engineer/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};
