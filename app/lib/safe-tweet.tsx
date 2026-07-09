import { getTweet } from "react-tweet/api";
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from "react-tweet";
import type { Tweet as TweetType } from "react-tweet/api";
import { Suspense } from "react";

/**
 * Drop-in replacement for react-tweet's <Tweet id={...} /> that tolerates
 * tweets whose `entities` object is missing keys (hashtags/user_mentions/
 * urls/symbols) — the Twitter syndication API doesn't always include empty
 * arrays for absent entity types, and react-tweet's parser assumes it will,
 * throwing "entities is not iterable" during static generation. We sanitize
 * before handing the tweet to react-tweet's own renderer.
 */
function sanitizeTweet(tweet: TweetType): TweetType {
  const entities = tweet.entities ?? {};
  return {
    ...tweet,
    entities: {
      ...entities,
      hashtags: entities.hashtags ?? [],
      user_mentions: entities.user_mentions ?? [],
      urls: entities.urls ?? [],
      symbols: entities.symbols ?? [],
    },
  };
}

async function SafeTweetContent({ id }: { id: string }) {
  let tweet: TweetType | undefined;
  try {
    tweet = await getTweet(id);
  } catch (err) {
    console.error(err);
  }
  if (!tweet) return <TweetNotFound />;
  return <EmbeddedTweet tweet={sanitizeTweet(tweet)} />;
}

export function SafeTweet({ id }: { id: string }) {
  return (
    <Suspense fallback={<TweetSkeleton />}>
      <SafeTweetContent id={id} />
    </Suspense>
  );
}
