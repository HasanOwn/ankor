import { motion } from 'framer-motion';

interface StatsBoxProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

const StatsBox = ({ label, value, icon }: StatsBoxProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 text-center"
    >
      {icon && (
        <div className="flex justify-center mb-3 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
};

export default StatsBox;
