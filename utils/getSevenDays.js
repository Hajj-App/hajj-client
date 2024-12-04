export const getSevenDays = () => {
  const today = new Date();
  const days = [];
  
  const dateFormatter = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short'
  });

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const fullDate = dateFormatter.format(date);
    const [monthName, dayNumber] = fullDate.split(' ');
    
    days.push({
      gregorianDate: date,
      day: dayNumber.replace(',', ''),
      month: monthName
    });
  }

  return days;
};