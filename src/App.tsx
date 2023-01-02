import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import {
  ActivityStats,
  Goal,
  GoalMetric,
  GoalActivity,
  Tense,
  TokenResponse,
  ActivityTotal,
} from "./models";
import {
  ActionIcon,
  Button,
  Center,
  Container,
  Group,
  Modal,
  NativeSelect,
  NumberInput,
  Paper,
  Progress,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { MoonStars, Settings, Sun } from "tabler-icons-react";

/*
Journey
1 - Not logged in
    - Present a button to log in
    - User goes off to Strava
2 - User redirected back with shortlived token
3 - User SLT to get proper tokens
4 - Store proper tokens
5 - Use proper tokens to access data and get more tokens
*/

function App() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const {
    REACT_APP_REDIRECT_URL,
    REACT_APP_CLIENT_ID,
    REACT_APP_CLIENT_SECRET,
  } = process.env;
  const stravaLoginUrl = `http://www.strava.com/oauth/authorize?client_id=${REACT_APP_CLIENT_ID}&response_type=code&redirect_uri=${REACT_APP_REDIRECT_URL}/exchange_token&approval_prompt=force&scope=read`;
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, 0, 1);
  const oneDay = 1000 * 60 * 60 * 24;
  const daysLeftInYear = Math.ceil(
    (nextYear.getTime() - today.getTime()) / oneDay
  );

  const navigate = useNavigate();
  const [searchParams, _] = useSearchParams();
  const [cookies, setCookie, removeCookie] = useCookies([
    "stravaDeets",
    "stravaGoal",
  ]);

  const [loggedIn, setLoggedIn] = useState(false);
  const [goalModalOpened, setGoalModalOpened] = useState(false);
  const [goal, setGoal] = useState<Goal>({
    activity: GoalActivity.Running,
    metric: GoalMetric.Distance,
    threshold: 1000,
  });
  const [stats, setStats] = useState<ActivityStats>();

  const setGoalAndSave = (goal: Goal) => {
    setGoal(goal);
    setCookie("stravaGoal", goal);
  };

  const stravaDeets = cookies.stravaDeets as TokenResponse;

  if (loggedIn && !stravaDeets) {
    setLoggedIn(false);
  }

  if (stravaDeets && !loggedIn) {
    setLoggedIn(true);
  }

  const getActivity = (
    s: ActivityStats | undefined,
    a: GoalActivity,
    recent: boolean = false
  ) => {
    if (!s) return null;
    switch (a) {
      case GoalActivity.Running:
        return recent ? s.recent_run_totals : s.ytd_run_totals;
      case GoalActivity.Swimming:
        return recent ? s.recent_swim_totals : s.ytd_swim_totals;
      case GoalActivity.Cycling:
        return recent ? s.recent_ride_totals : s.ytd_ride_totals;
    }
  };

  const getMetric = (t: ActivityTotal | null, m: GoalMetric) => {
    if (!t) return 0;
    switch (m) {
      case GoalMetric.Count:
        return t.count;
      case GoalMetric.Distance:
        return Math.round(t.distance / 1000);
      case GoalMetric.MovingTime:
        return Math.round(t.moving_time / (60 * 60));
    }
  };

  const displayActivityName = (
    t: GoalActivity | string,
    tense: Tense = Tense.Present
  ) => {
    if (typeof t === "string") {
      t = GoalActivity[t as keyof typeof GoalActivity];
    }
    switch (t) {
      case GoalActivity.Running:
        switch (tense) {
          case Tense.Past:
            return "run";
          case Tense.Present:
          default:
            return "run";
        }
      case GoalActivity.Swimming:
        switch (tense) {
          case Tense.Past:
            return "swam";
          default:

          case Tense.Present:
            return "swim";
        }
      case GoalActivity.Cycling:
        switch (tense) {
          default:
          case Tense.Past:
            return "cycled";
          case Tense.Present:
            return "cycle";
        }
      default:
        break;
    }
  };

  const displayActivityCount = (m: GoalMetric | string) => {
    if (typeof m === "string") {
      m = GoalMetric[m as keyof typeof GoalMetric];
    }
    switch (m) {
      case GoalMetric.Count:
        return " times";
      case GoalMetric.Distance:
        return "km";
      case GoalMetric.MovingTime:
        return " hours";
    }
  };

  useEffect(() => {
    console.log("checking goals");
    console.log(cookies.stravaGoal);
    if (cookies.stravaGoal) {
      setGoal(cookies.stravaGoal);
    } else {
      setGoalModalOpened(true);
    }
  }, [cookies.stravaGoal, setGoal, setCookie, setGoalModalOpened]);

  useEffect(() => {
    async function getRealCodes(code: string) {
      const url = `https://www.strava.com/api/v3/oauth/token?client_id=${REACT_APP_CLIENT_ID}&client_secret=${REACT_APP_CLIENT_SECRET}&code=${code}&grant_type=authorization_code`;
      const response = await fetch(url, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        const tokens = data as TokenResponse;
        setCookie("stravaDeets", tokens);
        setLoggedIn(true);
      } else {
        console.error({ response });
      }
      navigate("/");
    }

    // Check for redirect
    const code = searchParams.get("code");
    if (code) {
      console.info("Responding to redirect");
      getRealCodes(code);
    }
  }, [
    REACT_APP_CLIENT_ID,
    REACT_APP_CLIENT_SECRET,
    searchParams,
    setCookie,
    navigate,
  ]);

  useEffect(() => {
    async function getData() {
      console.info("Time to grab some data");
      const now = Math.round(new Date().getTime() / 1000);
      if (stravaDeets.expires_at < now) {
        // refresh the tokens
        console.info("Refreshing tokens");
        const response = await fetch(
          `https://www.strava.com/api/v3/oauth/token?client_id=${REACT_APP_CLIENT_ID}&client_secret=${REACT_APP_CLIENT_SECRET}&refresh_token=${stravaDeets.refresh_token}}&grant_type=refresh_token`,
          { method: "POST" }
        );
        const data = await response.json();
        if (response.ok) {
          const tokens = data as TokenResponse;
          setCookie("stravaDeets", tokens);
          setLoggedIn(true);
        } else {
          console.error({ response });
        }
      }

      // get stats
      const response = await fetch(
        `https://www.strava.com/api/v3/athletes/${stravaDeets.athlete.id}/stats`,
        { headers: { Authorization: `Bearer ${stravaDeets.access_token}` } }
      );
      const data = await response.json();
      if (response.ok) {
        const stats = data as ActivityStats;
        setStats(stats);
      } else {
        console.error({ response });
      }
    }

    if (stravaDeets) {
      getData();
    }
  }, [REACT_APP_CLIENT_ID, REACT_APP_CLIENT_SECRET, setCookie, stravaDeets]);

  const metricCount = getMetric(getActivity(stats, goal.activity), goal.metric);

  return (
    <>
      <Modal
        centered
        size="auto"
        opened={goalModalOpened}
        onClose={() => setGoalModalOpened(false)}
        title="🏁Time to set a goal"
      >
        <Group style={{ marginTop: 10, marginBottom: 10 }}>
          <Text>I want to track the</Text>
          <NativeSelect
            data={[
              {
                value: GoalMetric.Count.toString(),
                label: "number of times",
              },
              {
                value: GoalMetric.Distance.toString(),
                label: "distance",
              },
              {
                value: GoalMetric.MovingTime.toString(),
                label: "length of time",
              },
            ]}
            value={goal.metric.toString()}
            onChange={(ev) => {
              setGoalAndSave({
                ...goal,
                metric:
                  GoalMetric[ev.currentTarget.value as keyof typeof GoalMetric],
              });
            }}
          />
          <Text> I </Text>
          <NativeSelect
            data={[
              {
                value: GoalActivity.Running.toString(),
                label: displayActivityName(GoalActivity.Running),
              },
              {
                value: GoalActivity.Cycling.toString(),
                label: displayActivityName(GoalActivity.Cycling),
              },
              {
                value: GoalActivity.Swimming.toString(),
                label: displayActivityName(GoalActivity.Swimming),
              },
            ]}
            value={goal.activity.toString()}
            onChange={(ev) =>
              setGoalAndSave({
                ...goal,
                activity:
                  GoalActivity[
                    ev.currentTarget.value as keyof typeof GoalActivity
                  ],
              })
            }
          />
        </Group>
        <Group>
          <Text>My target is</Text>
          <NumberInput
            required
            value={goal.threshold}
            onChange={(val) =>
              setGoalAndSave({ ...goal, threshold: val ?? 1000 })
            }
          />
          <Text>{displayActivityCount(goal.metric)}</Text>
        </Group>
      </Modal>
      <Container p="md" size={2000}>
        <Paper withBorder p="lg">
          <Container
            fluid
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              paddingRight: 0,
            }}
          >
            <Container
              fluid
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: 0,
              }}
            >
              <ActionIcon
                variant="outline"
                onClick={() => setGoalModalOpened(true)}
                style={{ margin: 5 }}
              >
                <Settings size={18} />
              </ActionIcon>

              <ActionIcon
                variant="outline"
                onClick={() => toggleColorScheme()}
                style={{ margin: 5 }}
              >
                {dark ? <Sun size={18} /> : <MoonStars size={18} />}
              </ActionIcon>
            </Container>

            {loggedIn && <Title>{stravaDeets.athlete.firstname}</Title>}
          </Container>

          {!loggedIn && (
            <Center>
              <Button component="a" href={stravaLoginUrl} size="xl" radius="lg">
                Strava login
              </Button>
            </Center>
          )}

          {stats && (
            <>
              <Center>
                <Text span size={120} weight={700}>
                  {metricCount}
                </Text>
                <Text span size={48}>
                  {displayActivityCount(goal.metric)}
                </Text>
              </Center>
              <p>
                <Text weight={700} span>
                  {daysLeftInYear}
                </Text>{" "}
                days left to {displayActivityName(goal.activity)}{" "}
                <Text weight={700} span>
                  {Math.floor(goal.threshold - metricCount)}
                </Text>
                {displayActivityCount(goal.metric)}
              </p>
              <p>
                That's about{" "}
                <Text weight={700} span>
                  {((goal.threshold - metricCount) / daysLeftInYear).toFixed(1)}
                </Text>
                {displayActivityCount(goal.metric)} a day. Over the past 4 weeks
                you've {displayActivityName(goal.activity, Tense.Past)}{" "}
                <Text weight={700} span>
                  {(
                    getMetric(
                      getActivity(stats, goal.activity, true),
                      goal.metric
                    ) /
                    (4 * 7)
                  ) // four weeks
                    .toFixed(1)}
                </Text>
                {displayActivityCount(goal.metric)} per day
              </p>
              <Progress
                value={(100 * metricCount) / goal.threshold}
                size={30}
              />
            </>
          )}
        </Paper>
      </Container>
    </>
  );
}

export default App;
