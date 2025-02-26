interface Day {
  day: string;
  month: string;
  date: Date;
}

export const getSevenDays = (): Day[] => {
  const days: Day[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    
    days.push({
      day,
      month,
      date
    });
  }
  
  return days;
}; 