const CornerCircles = () => {
  return (
    <>
      <div className="animate-float-slow pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-green-700/25 blur-3xl" />
      <div className="animate-float-slow pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-red-800/25 blur-3xl [animation-delay:8s]" />
    </>
  )
}

export default CornerCircles
