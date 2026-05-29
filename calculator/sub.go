package calculator

func Sub(num ...int) int {
	if len(num) == 0 {
		return 0
	}
	total := num[0]
	for _, n := range num[1:] {
		total -= n
	}
	return total
}
