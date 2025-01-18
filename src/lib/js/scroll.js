// Scroll to bottom
export const scrollToBottom = (node) => {
	node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
}