import PublicLayout from '@/components/PublicLayout';
import HomeView from '@/components/HomeView';
import { getHomeData } from '@/lib/home-data';

export const revalidate = 60;

export default async function HomePage() {
  const { articles, topics } = await getHomeData();
  const tickerItems = articles.slice(0, 6).map((a) => ({ slug: a.slug, title: a.title }));

  return (
    <PublicLayout tickerItems={tickerItems}>
      <HomeView articles={articles} topics={topics} />
    </PublicLayout>
  );
}
