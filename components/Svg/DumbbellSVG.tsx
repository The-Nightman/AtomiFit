import DumbbellSVG from '../../assets/images/svg/dumbbell-icon.svg';

interface DumbbellSVGProps {
  width?: number;
  height?: number;
  color: string;
}

const DumbbellIconSVG = ({ color, width = 50, height = 50 }: DumbbellSVGProps) => {
  return <DumbbellSVG width={width} height={height} color={color} />;
};

export default DumbbellIconSVG;
