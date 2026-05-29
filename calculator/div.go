package calculator

func Div(num ...int) int {
	if len(num) == 0 {
		return 0
	}
	total := num[0]
	for _, n := range num[1:] {
		if n != 0 {
			total /= n
		}
	}
	return total
}