import { Button } from '@/components/ui/button';
import type { BackButtonProps } from '@/interfaces/components';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ to, label = 'Back', className }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button variant="default" className={`${className} hover:bg-[linear-gradient(135deg,_hsl(175,_80%,_35%)_0%,_hsl(200,_80%,_45%)_100%)]`} onClick={handleClick}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

export default BackButton;
