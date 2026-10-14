export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  DeviceRegistration: { username?: string; password?: string; deviceId?: string };
  PendingApproval: { deviceId?: string };
};

export type MainTabParamList = {
  DashboardTab?: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  ChangeFirstPassword: undefined;
  MainTabs: undefined;
  ChatDetail: { conversationId: number };
  NewChat: undefined;
  CreateGroup: undefined;
  FileViewer: { file: any };
  UserMaster: undefined;
  CreateUser: undefined;
  UserTypeMaster: undefined;
  CompanyMaster: undefined;
  CreateCompany: undefined;
  DepartmentMaster: undefined;
  CloudStorageMaster: undefined;
  BulkUserImport: undefined;
};
