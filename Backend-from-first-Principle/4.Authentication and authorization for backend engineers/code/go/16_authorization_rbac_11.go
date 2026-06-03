type Subject struct{ ID, Dept, Role string }
type Resource struct{ OwnerID, Dept string; Archived bool }

// Policy: can `s` perform `action` on `r`, given the environment?
func CanEdit(s Subject, r Resource, hour int) bool {
    if r.Archived {
        return false
    }
    sameDept := s.Dept == r.Dept
    owns := s.ID == r.OwnerID
    businessHours := hour >= 9 && hour < 18
    // owner OR same-department editor, only in business hours
    return (owns || (sameDept && s.Role == "editor")) && businessHours
}

// usage inside a handler, after auth has populated the subject:
// if !CanEdit(subj, doc, time.Now().Hour()) {
//     http.Error(w, "forbidden", http.StatusForbidden)
// }
