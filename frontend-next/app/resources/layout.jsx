import { SponsorBar } from '@/components/resources/ResourceChrome';

export default function ResourcesLayout({ children }) {
  return (
    <div className="pb-16">
      {children}
      <SponsorBar />
    </div>
  );
}
