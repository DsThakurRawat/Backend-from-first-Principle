package calculator

func Sum(num ...int) int{
	total := 0

	for _, n := range num{
		total += n
	}
	return total
}