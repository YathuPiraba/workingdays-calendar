import { addDays, isSameDay, differenceInDays, startOfDay } from "date-fns";
import {
  WorkingDaysConfig,
  DayOfWeek,
  Holiday,
  Leave,
  LeaveStatus,
  WorkingDayStats,
  BusinessHoursResult,
} from "../../types/src/index";

/** Calculates working days, holidays, leaves, and business-hour summaries. */
export class WorkingDaysCalculator {
  private config: WorkingDaysConfig;
  private workingDayCache: Map<string, boolean>;
  private stats: Map<string, WorkingDayStats>;

  constructor(config: WorkingDaysConfig) {
    this.validateConfig(config);
    this.config = config;
    this.workingDayCache = new Map();
    this.stats = new Map();
  }

  /** Returns whether the given date is considered a working day. */
  public isWorkingDay(date: Date, employeeId?: string): boolean {
    const key = this.getCacheKey(date, employeeId);

    if (this.workingDayCache.has(key)) {
      return this.workingDayCache.get(key) || false;
    }

    if (this.config.customRules) {
      for (const rule of this.config.customRules.sort(
        (a, b) => b.priority - a.priority,
      )) {
        if (rule.enabled && rule.condition(date, this.config)) {
          const result = rule.isWorkingDay;
          this.workingDayCache.set(key, result);
          return result;
        }
      }
    }

    if (this.isWeekend(date)) {
      this.workingDayCache.set(key, false);
      return false;
    }

    if (this.isHoliday(date)) {
      this.workingDayCache.set(key, false);
      return false;
    }

    if (employeeId && this.isLeaveDay(date, employeeId)) {
      this.workingDayCache.set(key, false);
      return false;
    }

    this.workingDayCache.set(key, true);
    return true;
  }

  /** Returns whether the given date falls on a configured weekend. */
  public isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay() as DayOfWeek;
    return this.config.weekendDays.includes(dayOfWeek);
  }

  /** Returns whether the given date matches a configured holiday. */
  public isHoliday(date: Date): boolean {
    const dateOnly = startOfDay(date);
    return this.config.holidays.some((holiday: Holiday) => {
      if (!holiday.recurring) {
        return isSameDay(holiday.date, dateOnly);
      }
      return false;
    });
  }

  /** Returns whether the employee is on approved leave for the given date. */
  public isLeaveDay(date: Date, employeeId: string): boolean {
    const dateOnly = startOfDay(date);
    return this.config.leaves.some((leave: Leave) => {
      if (
        leave.employeeId !== employeeId ||
        leave.status !== LeaveStatus.Approved
      ) {
        return false;
      }

      const leaveStart = startOfDay(leave.startDate);
      const leaveEnd = startOfDay(leave.endDate);

      if (leave.isPartialDay && isSameDay(dateOnly, leaveStart)) {
        return true;
      }

      return dateOnly >= leaveStart && dateOnly <= leaveEnd;
    });
  }

  /** Counts working days within the inclusive date range. */
  public getWorkingDaysBetween(
    startDate: Date,
    endDate: Date,
    employeeId?: string,
  ): number {
    let count = 0;
    let current = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (current <= end) {
      if (this.isWorkingDay(current, employeeId)) {
        count++;
      }
      current = addDays(current, 1);
    }

    return count;
  }

  /** Returns the next available working day after the given date. */
  public getNextWorkingDay(date: Date, employeeId?: string): Date {
    let current = addDays(startOfDay(date), 1);

    while (!this.isWorkingDay(current, employeeId)) {
      current = addDays(current, 1);
    }

    return current;
  }

  /** Returns the previous available working day before the given date. */
  public getPreviousWorkingDay(date: Date, employeeId?: string): Date {
    let current = addDays(startOfDay(date), -1);

    while (!this.isWorkingDay(current, employeeId)) {
      current = addDays(current, -1);
    }

    return current;
  }

  /** Adds the specified number of working days to a date. */
  public addWorkingDays(date: Date, days: number, employeeId?: string): Date {
    if (days < 0) {
      return this.subtractWorkingDays(date, Math.abs(days), employeeId);
    }

    let current = startOfDay(date);
    let added = 0;

    while (added < days) {
      current = addDays(current, 1);
      if (this.isWorkingDay(current, employeeId)) {
        added++;
      }
    }

    return current;
  }

  /** Subtracts the specified number of working days from a date. */
  public subtractWorkingDays(
    date: Date,
    days: number,
    employeeId?: string,
  ): Date {
    let current = startOfDay(date);
    let subtracted = 0;

    while (subtracted < days) {
      current = addDays(current, -1);
      if (this.isWorkingDay(current, employeeId)) {
        subtracted++;
      }
    }

    return current;
  }

  /** Calculates a simple business-hours summary for the date range. */
  public calculateBusinessHours(
    startDate: Date,
    endDate: Date,
  ): BusinessHoursResult {
    const workingDays = this.getWorkingDaysBetween(startDate, endDate);
    const defaultHoursPerDay = 8;

    return {
      startDate,
      endDate,
      totalHours: workingDays * defaultHoursPerDay,
      workingDaysCount: workingDays,
      averageHoursPerDay: defaultHoursPerDay,
    };
  }

  /** Returns aggregated day statistics for the inclusive date range. */
  public getStatsForRange(startDate: Date, endDate: Date): WorkingDayStats {
    const key = `${startDate.getTime()}-${endDate.getTime()}`;

    if (this.stats.has(key)) {
      return this.stats.get(key)!;
    }

    let workingDays = 0;
    let weekendDays = 0;
    let holidayCount = 0;
    let leaveCount = 0;

    let current = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (current <= end) {
      if (this.isWeekend(current)) {
        weekendDays++;
      } else if (this.isHoliday(current)) {
        holidayCount++;
      } else {
        workingDays++;
      }

      current = addDays(current, 1);
    }

    const stats: WorkingDayStats = {
      totalDays: differenceInDays(end, startOfDay(startDate)) + 1,
      workingDays,
      weekendDays,
      holidays: holidayCount,
      leaves: leaveCount,
      events: 0,
      compressed: 0,
    };

    this.stats.set(key, stats);
    return stats;
  }

  /** Returns the number of working days in the specified month. */
  public getWorkingDaysInMonth(
    year: number,
    month: number,
    employeeId?: string,
  ): number {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    return this.getWorkingDaysBetween(startDate, endDate, employeeId);
  }

  /** Returns the number of working days in the specified year. */
  public getWorkingDaysInYear(year: number, employeeId?: string): number {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return this.getWorkingDaysBetween(startDate, endDate, employeeId);
  }

  /** Updates the calculator configuration and resets cached values. */
  public updateConfig(config: Partial<WorkingDaysConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache();
  }

  /** Clears all internal caches. */
  public clearCache(): void {
    this.workingDayCache.clear();
    this.stats.clear();
  }

  /** Returns a shallow copy of the current configuration. */
  public getConfig(): WorkingDaysConfig {
    return { ...this.config };
  }

  /** Internal helpers for caching and configuration validation. */
  private getCacheKey(date: Date, employeeId?: string): string {
    const dateStr = startOfDay(date).getTime().toString();
    return employeeId ? `${dateStr}-${employeeId}` : dateStr;
  }

  private validateConfig(config: WorkingDaysConfig): void {
    if (!config.weekendDays || config.weekendDays.length === 0) {
      throw new Error("weekendDays must be defined and non-empty");
    }

    if (!Array.isArray(config.holidays)) {
      config.holidays = [];
    }

    if (!Array.isArray(config.leaves)) {
      config.leaves = [];
    }
  }
}

export default WorkingDaysCalculator;
