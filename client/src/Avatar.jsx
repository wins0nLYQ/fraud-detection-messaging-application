export default function Avatar({userId, username, online}) {
    // Avatar colours
    const colors = ['bg-red-200', 'bg-green-200', 
                    'bg-purple-200', 'bg-blue-200', 
                    'bg-yellow-200', 'bg-teal-200'];

    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];

    return (
        <div className={"w-9 h-9 relative rounded-full flex items-center " + color}>
            <div className="text-center w-full opacity-70">{username[0]}</div>
            {online && (
                <div className="absolute w-3.5 h-3.5 bg-green-400 top-0 -right-0.5 rounded-full border-2 border-white"></div>
            )}

            {!online && (
                <div className="absolute w-3.5 h-3.5 bg-gray-400 top-0 -right-0.5 rounded-full border-2 border-white"></div>
            )}
        </div>
    );
}