import moment from "moment-hijri"

export const getSevenDays = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const hijriDate = moment().add(i, "days").format("iD iMMMM"); // Hijri Day and Month
    const [day, month] = hijriDate.split(" ");
    
    return {
      day, // 21
      month, // Dhul-Hijjah
    };
  });
};
