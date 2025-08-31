export interface ChessUser {
  username: string;
  realName: string;
}

export interface BotData {
  users: ChessUser[];
  dailyStatsTime: string;
  chatIds: number[];
}

export interface LichessUserData {
  id: string;
  username: string;
  perfs: {
    bullet?: { rating: number; games: number };
    blitz?: { rating: number; games: number };
    rapid?: { rating: number; games: number };
    puzzle?: { rating: number; games: number };
  };
  count: {
    all: number;
    rated: number;
    ai: number;
    draw: number;
    drawH: number;
    loss: number;
    lossH: number;
    win: number;
    winH: number;
    bookmark: number;
    playing: number;
    import: number;
    me: number;
  };
  createdAt: number;
  seenAt: number;
  playTime: {
    total: number;
    tv: number;
  };
}

export interface LichessActivityData {
  interval: {
    start: number;
    end: number;
  };
  games?: {
    [key: string]: {
      win: number;
      loss: number;
      draw: number;
      rp?: {
        before: number;
        after: number;
      };
    };
  };
  puzzles?: {
    score: {
      win: number;
      loss: number;
      draw: number;
      rp: { before: number; after: number };
    };
  };
}

export interface DailyStats {
  username: string;
  realName: string;
  gamesPlayed: {
    total: number;
    bullet: number;
    blitz: number;
    rapid: number;
    classical: number;
  };
  puzzlesSolved: {
    win: number;
    loss: number;
    draw: number;
    rp: { before: number; after: number };
  };
  ratingChanges: {
    bullet: number;
    blitz: number;
    rapid: number;
  };
  averageRating: number;
  totalRatedGames: number;
}
