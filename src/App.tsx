import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { ActivityStats, TokenResponse } from "./models";
import {
  Button,
  Center,
  Container,
  Paper,
  Progress,
  Text,
  Title,
} from "@mantine/core";

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
  const [cookies, setCookie, removeCookie] = useCookies(["stravaDeets"]);

  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState<ActivityStats>();

  const stravaDeets = cookies.stravaDeets as TokenResponse;

  const kmsRun = Math.round((stats?.ytd_run_totals.distance ?? 0) / 1000);

  if (loggedIn && !stravaDeets) {
    setLoggedIn(false);
  }

  if (stravaDeets && !loggedIn) {
    setLoggedIn(true);
  }

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

  return (
    <Container p="md">
      <Paper withBorder p="lg">
        {!loggedIn && (
          <Center>
            <Button component="a" href={stravaLoginUrl} size="xl" radius="lg">
              Strava login
            </Button>
          </Center>
        )}
        {loggedIn && <Title>{stravaDeets.athlete.firstname}</Title>}
        {stats && (
          <>
            <Center>
              <Text span size={120} weight={700}>
                {kmsRun}
              </Text>
              <Text span size={48}>
                km
              </Text>
            </Center>
            <p>
              <Text weight={700} span>
                {daysLeftInYear}
              </Text>{" "}
              days left to run{" "}
              <Text weight={700} span>
                {Math.floor(1000 - kmsRun)}
              </Text>
              km
            </p>
            <p>
              That's about{" "}
              <Text weight={700} span>
                {Math.ceil(Math.floor(1000 - kmsRun) / daysLeftInYear)}
              </Text>
              km a day
            </p>
            <Progress value={kmsRun / 10} size={30} />
          </>
        )}
      </Paper>
    </Container>
  );
}

export default App;
