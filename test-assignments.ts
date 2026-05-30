import { dataService } from './src/services/dataService.js';
console.log("Testing...");
dataService.createAssignments([{
  customerId: "kh123",
  staffId: "staff1",
  campaignId: "camp1",
  status: "PENDING",
  assignedDate: new Date().toISOString()
}]).then(res => console.log(res)).catch(console.error);
