// packages/types/src/index.ts

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export enum LeaveType {
  Vacation = "vacation",
  Sick = "sick",
  Maternity = "maternity",
  Paternity = "paternity",
  Unpaid = "unpaid",
  Casual = "casual",
  Bereavement = "bereavement",
  Training = "training",
}

export enum LeaveStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  Cancelled = "cancelled",
}

export enum HolidayType {
  National = "national",
  Religious = "religious",
  Cultural = "cultural",
  Company = "company",
  Regional = "regional",
  Local = "local",
}

export enum EventType {
  Meeting = "meeting",
  Deadline = "deadline",
  TaskReminder = "task_reminder",
  Custom = "custom",
}

// ============ Interfaces ============

export interface DayWorkingHours {
  start: string;
  end: string;
  breakDuration?: number;
  isWorking: boolean;
}

export interface WorkingHours {
  [dayOfWeek: number]: DayWorkingHours;
}

export interface RecurringPattern {
  frequency: "YEARLY" | "MONTHLY" | "WEEKLY" | "DAILY";
  interval?: number;
  count?: number;
  until?: Date;
  byMonthDay?: number[];
  byMonth?: number[];
  byDay?: string[];
  bySetPos?: number[];
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  type: HolidayType;
  recurring?: RecurringPattern;
  countries?: string[];
  isMovable?: boolean;
  priority?: number;
  color?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  isPartialDay?: boolean;
  partialDayType?: "morning" | "afternoon";
  status: LeaveStatus;
  approvedBy?: string;
  rejectionReason?: string;
  comment?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveType;
  totalBalance: number;
  usedDays: number;
  remainingBalance: number;
  carriedOver: number;
  lastUpdated: Date;
}

export interface Shift {
  id: string;
  name: string;
  pattern: "fixed" | "rotating" | "flexible";
  workDays: DayOfWeek[];
  workHoursPerDay: number;
  employees: string[];
  startDate: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface CustomRule {
  id: string;
  name: string;
  description?: string;
  condition: (date: Date, config: WorkingDaysConfig) => boolean;
  isWorkingDay: boolean;
  priority: number;
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: EventType;
  isBlocking: boolean;
  description?: string;
  assignedTo?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingDaysConfig {
  weekendDays: DayOfWeek[];
  workingHours?: WorkingHours;
  timezone?: string;
  locale?: string;
  holidays: Holiday[];
  leaves: Leave[];
  shifts?: Shift[];
  events?: CalendarEvent[];
  customRules?: CustomRule[];
  compressedWeekThreshold?: number;
  countWeekendAsPartialDay?: boolean;
  autoApproveLeaves?: boolean;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface WorkingDayStats {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidays: number;
  leaves: number;
  events: number;
  compressed: number;
}

export interface TeamAvailability {
  date: Date;
  available: number;
  onLeave: number;
  total: number;
  availabilityPercentage: number;
  details: Map<string, "available" | "on_leave" | "weekend" | "holiday">;
}

export interface LeaveAnalytics {
  period: DateRange;
  totalLeavesTaken: number;
  avgLeavePerEmployee: number;
  leavesByType: Map<LeaveType, number>;
  leavesByMonth: Map<number, number>;
  topLeaveTakers: Array<{
    employeeId: string;
    count: number;
  }>;
  utilizationRate: number;
}

export interface TeamMetrics {
  period: DateRange;
  teamSize: number;
  avgAvailability: number;
  workCapacityHours: number;
  projectedCapacity: number;
  utilizationRate: number;
}

export interface BusinessHoursResult {
  startDate: Date;
  endDate: Date;
  totalHours: number;
  workingDaysCount: number;
  averageHoursPerDay: number;
}

export interface SLAInfo {
  deadline: Date;
  remainingWorkingDays: number;
  remainingHours: number;
  isOnTrack: boolean;
  riskLevel: "low" | "medium" | "high";
}
