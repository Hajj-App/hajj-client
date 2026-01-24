declare module 'moment-hijri' {
  import { Moment } from 'moment';
  
  interface MomentHijri extends Moment {
    iMonth(): number;
    iDate(): number;
    iYear(): number;
    format(format?: string): string;
  }
  
  function momentHijri(inp?: any, format?: string, strict?: boolean): MomentHijri;
  
  export = momentHijri;
}
