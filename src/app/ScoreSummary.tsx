import { tw } from '../layout/tw';

type Props = {
  className?: string;
};

export const ScoreSummary = (props: Props) => {
  return <div className={tw('flex', props.className)}>score summary</div>;
};
