import AtomiFitShortLogoSvg from "../../assets/images/svg/atomifit-logo-short.svg";

interface AtomiFitShortSVGProps {
  width?: number;
  height?: number;
  color: string;
}

const AtomiFitShortSVG = ({ color, width = 50, height = 50 }: AtomiFitShortSVGProps) => {
  return <AtomiFitShortLogoSvg width={width} height={height} color={color} />;
};

export default AtomiFitShortSVG;
