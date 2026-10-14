import Svg, { Path, Circle, Rect, Polyline, Line, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const MessagesSquareIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
    <Path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx={12} cy={7} r={4} />
  </Svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 20, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <Circle cx={12} cy={12} r={3} />
  </Svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <Line x1={2} y1={2} x2={22} y2={22} />
  </Svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </Svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 20, color = '#0f172a' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 19-7-7 7-7" />
    <Path d="M19 12H5" />
  </Svg>
);

export const ReplyIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 17 4 12 9 7" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, color = '#94a3b8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={11} cy={11} r={8} />
    <Line x1={21} y1={21} x2={16.65} y2={16.65} />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={12} y1={5} x2={12} y2={19} />
    <Line x1={5} y1={12} x2={19} y2={12} />
  </Svg>
);

export const PaperclipIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <Circle cx={12} cy={13} r={3} />
  </Svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect width={18} height={18} x={3} y={3} rx={2} ry={2} />
    <Circle cx={9} cy={9} r={2} />
    <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx={9} cy={7} r={4} />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

export const BullhornIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m3 11 18-5v12L3 13v-2z" />
    <Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </Svg>
);

export const HashIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={4} y1={9} x2={20} y2={9} />
    <Line x1={4} y1={15} x2={20} y2={15} />
    <Line x1={10} y1={3} x2={8} y2={21} />
    <Line x1={16} y1={3} x2={14} y2={21} />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

export const BuildingIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={4} y={2} width={16} height={20} rx={2} ry={2} />
    <Path d="M9 22v-4h6v4" />
    <Path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
  </Svg>
);

export const FileIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 18, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={3} />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ size = 18, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1={21} y1={12} x2={9} y2={12} />
  </Svg>
);

export const XMarkIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={18} y1={6} x2={6} y2={18} />
    <Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={18} y1={20} x2={18} y2={10} />
    <Line x1={12} y1={20} x2={12} y2={4} />
    <Line x1={6} y1={20} x2={6} y2={14} />
  </Svg>
);

export const MobileIcon: React.FC<IconProps> = ({ size = 20, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={5} y={2} width={14} height={20} rx={2} ry={2} />
    <Line x1={12} y1={18} x2={12.01} y2={18} />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m18 15-6-6-6 6" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

export const CloudIcon: React.FC<IconProps> = ({ size = 20, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </Svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = 20, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m12 2 10 5.5L12 13 2 7.5 12 2z" />
    <Path d="m2 12.5 10 5.5 10-5.5" />
    <Path d="m2 17.5 10 5.5 10-5.5" />
  </Svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 18, color = '#EF5350' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 16, color = '#94a3b8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
    <Line x1={16} y1={2} x2={16} y2={6} />
    <Line x1={8} y1={2} x2={8} y2={6} />
    <Line x1={3} y1={10} x2={21} y2={10} />
  </Svg>
);

export const ShieldUserIcon: React.FC<IconProps> = ({ size = 18, color = '#7c3aed' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Circle cx={12} cy={9} r={2.5} />
    <Path d="M8 15a4 4 0 0 1 8 0" />
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19" />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 16, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const BanIcon: React.FC<IconProps> = ({ size = 16, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Line x1={4.93} y1={4.93} x2={19.07} y2={19.07} />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 16, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 16, color = '#7c3aed' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
  </Svg>
);

export const HardDriveIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="12" x2="2" y2="12" />
    <Path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <Line x1="6" y1="16" x2="6.01" y2="16" />
    <Line x1="10" y1="16" x2="10.01" y2="16" />
  </Svg>
);

export const FolderIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </Svg>
);
export const DownloadIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({ size = 18, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect width={20} height={16} x={2} y={4} rx={2} />
    <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Svg>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 20, color = '#25D366' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <Path d="M9.5 9a.5.5 0 0 0-.5.5c0 .3.1.6.3.8l1.4 1.4a5.5 5.5 0 0 0 2.4 1.4l1.4-.4c.3-.1.6-.1.8.1.3.2.6.5.6.8a.5.5 0 0 1-.5.5c-1.5 0-3-.5-4.2-1.5S9.5 10.5 9.5 9z" fill={color} stroke="none" />
  </Svg>
);

export const QrCodeIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
    <Path d="M14 14h3v3h-3z" fill={color} stroke="none" />
    <Path d="M20 14v3h-3" />
    <Path d="M14 20h6" />
  </Svg>
);

export const PowerOffIcon: React.FC<IconProps> = ({ size = 18, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <Line x1="12" y1="2" x2="12" y2="12" />
  </Svg>
);

export const CheckCheckIcon: React.FC<IconProps> = ({ size = 16, color = '#3b82f6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 7 17l-5-5" />
    <Path d="m22 10-7.5 7.5L13 16" />
  </Svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 18, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Line x1="12" y1="8" x2="12" y2="12" />
    <Line x1="12" y1="16" x2="12.01" y2="16" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={18} y1={6} x2={6} y2={18} />
    <Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);

export const ColorfulCameraIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <Defs>
      <LinearGradient id="camBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FB7185" />
        <Stop offset="100%" stopColor="#E11D48" />
      </LinearGradient>
      <LinearGradient id="camLensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#334155" />
        <Stop offset="100%" stopColor="#0F172A" />
      </LinearGradient>
      <LinearGradient id="camGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="100%" stopColor="#0284C7" />
      </LinearGradient>
    </Defs>
    <Circle cx="28" cy="28" r="28" fill="url(#camBgGrad)" />
    <Path
      d="M37 20h-3.2l-1.4-2.4c-.4-.6-1-.9-1.7-.9h-5.4c-.7 0-1.3.3-1.7.9L22.2 20H19c-2.2 0-4 1.8-4 4v12c0 2.2 1.8 4 4 4h18c2.2 0 4-1.8 4-4V24c0-2.2-1.8-4-4-4z"
      fill="#FFFFFF"
    />
    <Circle cx="28" cy="29" r="6.5" fill="url(#camLensGrad)" />
    <Circle cx="28" cy="29" r="4.2" fill="url(#camGlassGrad)" />
    <Circle cx="26.5" cy="27.5" r="1.3" fill="#FFFFFF" opacity="0.9" />
    <Circle cx="35.5" cy="23.5" r="1.2" fill="#FDA4AF" />
  </Svg>
);

export const ColorfulPhotoIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <Defs>
      <LinearGradient id="photoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A855F7" />
        <Stop offset="100%" stopColor="#6D28D9" />
      </LinearGradient>
      <LinearGradient id="photoSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#67E8F9" />
        <Stop offset="100%" stopColor="#0284C7" />
      </LinearGradient>
      <LinearGradient id="photoMtnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10B981" />
        <Stop offset="100%" stopColor="#047857" />
      </LinearGradient>
      <LinearGradient id="photoMtn2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
    </Defs>
    <Circle cx="28" cy="28" r="28" fill="url(#photoBgGrad)" />
    <Rect x="15" y="16" width="26" height="24" rx="4" fill="#FFFFFF" />
    <Rect x="17" y="18" width="22" height="17" rx="2.5" fill="url(#photoSkyGrad)" />
    <Circle cx="22" cy="22" r="2.5" fill="#FBBF24" />
    <Path d="M17 33l5-6.5c.6-.8 1.8-.8 2.4 0l2.6 3.5 3-4c.6-.8 1.8-.8 2.4 0l6.6 8.5H17z" fill="url(#photoMtnGrad)" />
    <Path d="M25 34l3.5-4.5c.5-.7 1.5-.7 2 0l8.5 11H25z" fill="url(#photoMtn2Grad)" opacity="0.8" />
  </Svg>
);

export const ColorfulDocumentIcon: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <Defs>
      <LinearGradient id="docBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </LinearGradient>
      <LinearGradient id="docFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#BFDBFE" />
        <Stop offset="100%" stopColor="#60A5FA" />
      </LinearGradient>
    </Defs>
    <Circle cx="28" cy="28" r="28" fill="url(#docBgGrad)" />
    <Path
      d="M19 15h11l9 9v16c0 1.66-1.34 3-3 3H19c-1.66 0-3-1.34-3-3V18c0-1.66 1.34-3 3-3z"
      fill="#FFFFFF"
    />
    <Path
      d="M30 15v6c0 1.66 1.34 3 3 3h6L30 15z"
      fill="url(#docFoldGrad)"
    />
    <Rect x="21" y="27" width="14" height="2.2" rx="1.1" fill="#93C5FD" />
    <Rect x="21" y="32" width="14" height="2.2" rx="1.1" fill="#3B82F6" />
    <Rect x="21" y="37" width="9" height="2.2" rx="1.1" fill="#60A5FA" />
  </Svg>
);

export const VideoIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="23 7 16 12 23 17 23 7" />
    <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
  </Svg>
);

export const VideoOffIcon: React.FC<IconProps> = ({ size = 20, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m4 0h5a2 2 0 0 1 2 2v3l7-5v14l-4.14-2.96" />
    <Line x1={1} y1={1} x2={23} y2={23} />
  </Svg>
);

export const PhoneOffIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <Line x1={1} y1={1} x2={23} y2={23} />
  </Svg>
);

export const MicIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Line x1={12} y1={19} x2={12} y2={23} />
    <Line x1={8} y1={23} x2={16} y2={23} />
  </Svg>
);

export const MicOffIcon: React.FC<IconProps> = ({ size = 20, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={1} y1={1} x2={23} y2={23} />
    <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <Line x1={12} y1={19} x2={12} y2={23} />
    <Line x1={8} y1={23} x2={16} y2={23} />
  </Svg>
);

export const SwitchCameraIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1={12} y1={15} x2={12} y2={3} />
  </Svg>
);

export const VolumeUpIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Svg>
);

export const VolumeOffIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <Line x1={23} y1={9} x2={17} y2={15} />
    <Line x1={17} y1={9} x2={23} y2={15} />
  </Svg>
);

export const MinimizeIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="4 14 10 14 10 20" />
    <Polyline points="20 10 14 10 14 4" />
    <Line x1={14} y1={10} x2={21} y2={3} />
    <Line x1={3} y1={21} x2={10} y2={14} />
  </Svg>
);

export const MaximizeIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 3 21 3 21 9" />
    <Polyline points="9 21 3 21 3 15" />
    <Line x1={21} y1={3} x2={14} y2={10} />
    <Line x1={3} y1={21} x2={10} y2={14} />
  </Svg>
);

export const PhoneIncomingIcon: React.FC<IconProps> = ({ size = 20, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="16 2 16 8 22 8" />
    <Line x1="23" y1="1" x2="16" y2="8" />
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const PhoneOutgoingIcon: React.FC<IconProps> = ({ size = 20, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 7 23 1 17 1" />
    <Line x1="16" y1="8" x2="23" y2="1" />
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

export const PhoneMissedIcon: React.FC<IconProps> = ({ size = 20, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="23" y1="1" x2="17" y2="7" />
    <Line x1="17" y1="1" x2="23" y2="7" />
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);export const CityIcon: React.FC<IconProps> = ({ size = 20, color = '#2563eb' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21h18" />
    <Path d="M5 21V7l8-4v18" />
    <Path d="M13 9.5V21" />
    <Path d="M19 21V11l-6-4" />
    <Line x1="9" y1="9" x2="9" y2="9.01" />
    <Line x1="9" y1="13" x2="9" y2="13.01" />
    <Line x1="9" y1="17" x2="9" y2="17.01" />
  </Svg>
);

export const BuildingOfficeIcon: React.FC<IconProps> = ({ size = 20, color = '#2563eb' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <Path d="M9 22v-4h6v4" />
    <Line x1="8" y1="6" x2="10" y2="6" />
    <Line x1="14" y1="6" x2="16" y2="6" />
    <Line x1="8" y1="10" x2="10" y2="10" />
    <Line x1="14" y1="10" x2="16" y2="10" />
    <Line x1="8" y1="14" x2="10" y2="14" />
    <Line x1="14" y1="14" x2="16" y2="14" />
  </Svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Line x1={12} y1={16} x2={12} y2={12} />
    <Line x1={12} y1={8} x2={12.01} y2={8} />
  </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Line x1={2} y1={12} x2={22} y2={12} />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Svg>
);

export const NetworkIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={16} y={16} width={6} height={6} rx={1} />
    <Rect x={2} y={16} width={6} height={6} rx={1} />
    <Rect x={9} y={2} width={6} height={6} rx={1} />
    <Path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <Line x1={12} y1={12} x2={12} y2={8} />
  </Svg>
);

export const HandshakeIcon: React.FC<IconProps> = ({ size = 20, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <Path d="M12 5v14" />
  </Svg>
);

export const UploadCloudIcon: React.FC<IconProps> = ({ size = 20, color = '#059669' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m16 16-4-4-4 4" />
    <Path d="M12 12v9" />
    <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    <Path d="m16 16-4-4-4 4" />
  </Svg>
);

export const FileSpreadsheetIcon: React.FC<IconProps> = ({ size = 20, color = '#059669' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <Polyline points="14 2 14 8 20 8" />
    <Path d="M8 13h2" />
    <Path d="M8 17h2" />
    <Path d="M14 13h2" />
    <Path d="M14 17h2" />
  </Svg>
);

export const PinIcon: React.FC<IconProps> = ({ size = 16, color = '#d97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="17" x2="12" y2="22" />
    <Path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v5.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24Z" />
  </Svg>
);


