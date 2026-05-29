package calculator

func Mul(num ...int) int {
	if len(num) == 0 {
		return 0
	}
	total := 1
	for _, n := range num {
		total *= n
	}
	return total
}
