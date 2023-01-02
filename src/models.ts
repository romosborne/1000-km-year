export interface TokenResponse {
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: Athlete;
}

export interface Athlete {
  id: number;
  firstname: string;
}

export interface ActivityStats {
  ytd_run_totals: ActivityTotal;
  ytd_ride_totals: ActivityTotal;
  ytd_swim_totals: ActivityTotal;
  recent_run_totals: ActivityTotal;
  recent_ride_totals: ActivityTotal;
  recent_swim_totals: ActivityTotal;
}

export interface ActivityTotal {
  count: number;
  distance: number;
  moving_time: number;
}

export interface Goal {
  activity: GoalActivity;
  metric: GoalMetric;
  threshold: number;
}

export enum GoalActivity {
  Running = "Running",
  Swimming = "Swimming",
  Cycling = "Cycling",
}

export enum GoalMetric {
  Count = "Count",
  Distance = "Distance",
  MovingTime = "MovingTime",
}

export enum Tense {
  Present,
  Past,
}
