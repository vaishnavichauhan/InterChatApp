export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  DeviceRegistration: { username?: string; password?: string; deviceId?: string };
  PendingApproval: { deviceId?: string };
};

export type MainTabParamList = {
  ChatTab: undefined;
  DashboardTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  ChatDetail: { conversationId: number };
  NewChat: undefined;
  CreateGroup: undefined;
  FileViewer: { file: any };
  UserMaster: undefined;
  CreateUser: undefined;
  UserTypeMaster: undefined;
  DepartmentMaster: undefined;
  CloudStorageMaster: undefined;
};
