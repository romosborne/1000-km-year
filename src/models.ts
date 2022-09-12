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
  recent_run_totals: ActivityTotal;
}

export interface ActivityTotal {
  count: number;
  distance: number;
  moving_time: number;
}
