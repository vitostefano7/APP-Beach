// utils/objectIdConverter.ts
import mongoose from "mongoose";

export const convertObjectIdsToStrings = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (obj instanceof mongoose.Types.ObjectId) {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectIdsToStrings(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === '_id' || key.endsWith('Id') || key === 'user' || key === 'campo' || key === 'booking') {
        if (obj[key] instanceof mongoose.Types.ObjectId) {
          result[key] = obj[key].toString();
        } else if (obj[key] && typeof obj[key] === 'object') {
          result[key] = convertObjectIdsToStrings(obj[key]);
        } else {
          result[key] = obj[key];
        }
      } else {
        result[key] = convertObjectIdsToStrings(obj[key]);
      }
    }
  }
  return result;
};

// Oppure più semplicemente, usa JSON.parse/stringify
export const sanitizeObjectIds = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};