# Validation & Test Cases

| ID | Scenario | Expected result |
|---|---|---|
| TC01 | Login with valid demo credentials | JWT returned and dashboard opens |
| TC02 | Login with wrong password | 401 response |
| TC03 | Create lead without name | Validation error |
| TC04 | Create lead with valid data | Lead created with New status |
| TC05 | Filter by source | Only selected source appears |
| TC06 | Filter by status | Only selected status appears |
| TC07 | Search by name/phone/course | Matching leads returned |
| TC08 | Assign counsellor | Lead displays assigned counsellor |
| TC09 | Counsellor requests another user's lead | Access denied |
| TC10 | Add follow-up | Follow-up appears in history and next follow-up is set |
| TC11 | Complete follow-up | Follow-up marked completed |
| TC12 | Move lead to Converted | convertedAt is recorded |
| TC13 | Dashboard loads | KPI and distributions are shown |
| TC14 | Overdue follow-up exists | Overdue count increases |
| TC15 | Export lead list | CSV file downloads |
| TC16 | Delete lead as manager/admin | Lead removed |
| TC17 | Delete lead as counsellor | Access denied |
