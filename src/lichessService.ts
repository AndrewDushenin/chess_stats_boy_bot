import axios from 'axios';
import { LichessUserData, LichessActivityData, DailyStats } from './types';

const LICHESS_API_BASE_URL = 'https://lichess.org/api';

export async function getUserData(
  username: string
): Promise<LichessUserData | null> {
  try {
    const response = await axios.get(
      `${LICHESS_API_BASE_URL}/user/${username}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching user data for ${username}`);
    return null;
  }
}

export async function getUserActivity(
  username: string
): Promise<LichessActivityData[] | null> {
  try {
    const response = await axios.get(
      `${LICHESS_API_BASE_URL}/user/${username}/activity`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching user activity for ${username}:`, error);
    return null;
  }
}

export async function getDailyStats(
  username: string,
  realName: string
): Promise<DailyStats | null> {
  try {
    const userData = await getUserData(username);
    const activityData = await getUserActivity(username);

    if (!userData || !activityData || activityData.length === 0) {
      return null;
    }

    // Find activity that matches today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Find activity where the interval includes today
    const todayActivity = activityData.find((activity) => {
      return (
        activity.interval.start <= todayTimestamp &&
        activity.interval.end >= todayTimestamp
      );
    });

    // If no activity for today, return stats with zeros for games played
    const recentActivity = todayActivity || activityData[0];
    const hasActivityToday = !!todayActivity;

    // Initialize stats
    const stats: DailyStats = {
      username,
      realName,
      gamesPlayed: {
        total: 0,
        bullet: 0,
        blitz: 0,
        rapid: 0,
        classical: 0,
      },
      puzzlesSolved: {
        win: 0,
        loss: 0,
        draw: 0,
        rp: { before: 0, after: 0 },
      },
      ratingChanges: {
        bullet: 0,
        blitz: 0,
        rapid: 0,
      },
      averageRating: calculateAverageRating(userData),
      totalRatedGames: userData.count.rated,
    };

    // Process games data
    if (recentActivity.games) {
      if (recentActivity.games.bullet) {
        stats.gamesPlayed.bullet =
          recentActivity.games.bullet.win +
          recentActivity.games.bullet.loss +
          recentActivity.games.bullet.draw;

        if (recentActivity.games.bullet.rp) {
          stats.ratingChanges.bullet =
            recentActivity.games.bullet.rp.after -
            recentActivity.games.bullet.rp.before;
        }
      }

      if (recentActivity.games.blitz) {
        stats.gamesPlayed.blitz =
          recentActivity.games.blitz.win +
          recentActivity.games.blitz.loss +
          recentActivity.games.blitz.draw;

        if (recentActivity.games.blitz.rp) {
          stats.ratingChanges.blitz =
            recentActivity.games.blitz.rp.after -
            recentActivity.games.blitz.rp.before;
        }
      }

      if (recentActivity.games.rapid) {
        stats.gamesPlayed.rapid =
          recentActivity.games.rapid.win +
          recentActivity.games.rapid.loss +
          recentActivity.games.rapid.draw;

        if (recentActivity.games.rapid.rp) {
          stats.ratingChanges.rapid =
            recentActivity.games.rapid.rp.after -
            recentActivity.games.rapid.rp.before;
        }
      }

      stats.gamesPlayed.total =
        stats.gamesPlayed.bullet +
        stats.gamesPlayed.blitz +
        stats.gamesPlayed.rapid;
    }

    // Process puzzles data
    if (recentActivity.puzzles) {
      stats.puzzlesSolved.win = recentActivity.puzzles.score.win;
      stats.puzzlesSolved.loss = recentActivity.puzzles.score.loss;
      stats.puzzlesSolved.draw = recentActivity.puzzles.score.draw;
      stats.puzzlesSolved.rp = {
        before: recentActivity.puzzles.score.rp.before,
        after: recentActivity.puzzles.score.rp.after,
      };
    }

    return stats;
  } catch (error) {
    console.error(`Error getting daily stats for ${username}:`, error);
    return null;
  }
}

function calculateAverageRating(userData: LichessUserData): number {
  const ratings: number[] = [];

  if (userData.perfs.bullet?.rating) {
    ratings.push(userData.perfs.bullet.rating);
  }

  if (userData.perfs.blitz?.rating) {
    ratings.push(userData.perfs.blitz.rating);
  }

  if (userData.perfs.rapid?.rating) {
    ratings.push(userData.perfs.rapid.rating);
  }

  if (ratings.length === 0) {
    return 0;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round(sum / ratings.length);
}
