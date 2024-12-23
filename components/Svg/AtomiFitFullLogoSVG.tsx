import AtomiFitFullLogoSvg from "../../assets/images/svg/atomifit-fullname.svg";

interface AtomiFitFullLogoSVGProps {
  width?: number;
  height?: number;
  color: string;
}

const AtomiFitFullLogoSVG = ({
  color,
  height,
  width,
}: AtomiFitFullLogoSVGProps) => {
  return <AtomiFitFullLogoSvg width={width} height={height} color={color} />;
};

export default AtomiFitFullLogoSVG;
