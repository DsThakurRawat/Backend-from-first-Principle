from dataclasses import dataclass
from datetime import datetime

@dataclass
class Subject: id: str; dept: str; role: str
@dataclass
class Resource: owner_id: str; dept: str; archived: bool

# Policy: can `s` perform the action on `r`, given the environment?
def can_edit(s: Subject, r: Resource, hour: int) -> bool:
    if r.archived:
        return False
    owns = s.id == r.owner_id
    same_dept = s.dept == r.dept
    business_hours = 9 <= hour < 18
    # owner OR same-department editor, only in business hours
    return (owns or (same_dept and s.role == "editor")) and business_hours

# usage inside a view, after auth populated the subject:
# if not can_edit(subj, doc, datetime.now().hour):
#     return jsonify(error="forbidden"), 403
