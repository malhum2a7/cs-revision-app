import React, { useMemo } from 'react';
import ProgressPie from './ProgressPie';

export default function SectionProgress({ section }) {
  const total = section.topics.length;
  const completed = useMemo(() => {
    return section.topics.filter(
      (t) =>
        localStorage.getItem(`completed_${section.sectionSlug}_${t.topicSlug}`) === 'true'
    ).length;
  }, [section]);

  return (
    <div className="flex items-center gap-2">
      <ProgressPie completed={completed} total={total} />
      <div>{completed}/{total} topics completed</div>
    </div>
  );
}
