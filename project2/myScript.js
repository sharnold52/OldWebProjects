// constant setup for grid
    const numCols = 7;
    const numRows = 6;
    
    // contains the grid itself
    const container = document.querySelector("#gridContainer");
    const arrowContainer = document.querySelector("#arrowContainer");
    
    // creates a cell
    const span = document.createElement('span');
    span.className = 'cell';
    
    // array of cells
    const cells = [];
    
    // array of arrows
    const arrows = [];
	
	// red and blue score;
	let redScore = 0;
	let blueScore = 0;
    
    //creates top row of arrows and creates value to keep track of whether or not event listeners are activated
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'arrow';
	let listenersOn = true;
    for(let col=0; col <numCols; col++)
    {
        let arrow = arrowSpan.cloneNode();
        let downArrow = document.createElement('i');
        arrow.appendChild(downArrow);
        arrowContainer.appendChild(arrow);
		arrow.addEventListener("click", fillCell);
        arrows.push(arrow);
    }
    
    // establishes grid
	for (let row=0;row<numRows;row++){
		cells.push([]);
		for (let col = 0; col < numCols; col++)
		{
		    let cell = span.cloneNode();
		    container.appendChild(cell);
		    cells[row][col] = cell;
		}
        let br = document.createElement('br');
        container.appendChild(br);
	}
	
	// add functionality to reset button
	let reset = document.querySelector('#reset');
	reset.onclick = resetGame;
	
	// current player color
	let playerColor = "cellFilledRed";
	
	// function that fills corresponding cell
	function fillCell(e){
		
		// makes sure all nodes in column aren't already filled
		let col = arrows.indexOf(this);
		if(cells[0][col].className != 'cellFilledRed' && cells[0][col].className != 'cellFilledBlue')
		{
			// audio
			let slideSound = new Audio('slide.wav');
			slideSound.play();
			
			// loop through until proper node is filled
			let done = false;
			let i = 0;
			while(!done)
			{
				// get current and next nodes
				let current = cells[i][col];
				let next;
				
				// update next node
				if(i+1 < numRows)
				{
					next = cells[i+1][col];
				}
				else
				{
					next = current;
				}
			
				// fill current node
				current.classList.remove("cell");
				current.className = playerColor;
				
				// check next node to see if it is filled
				if ((next.className != 'cellFilledRed' && next.className != 'cellFilledBlue')&& i < numRows)
				{
					current.classList.remove(playerColor);
					current.className = 'cell';
					i++;
				}
				else
				{
					done = true;
				}
			}
			
			// check for win
			let win = false;
			win = winCheck();
			
			// print win
			let messager = document.querySelector("#messenger");
			if(win)
			{
				let player;
				let scoreToIncrement;
				if(playerColor === "cellFilledRed")
				{
					player = "Red";
					scoreToIncrement = document.querySelector("#redScore");
					redScore++;
					scoreToIncrement.innerHTML = redScore;
				}
				else
				{
					player = "Blue";
					scoreToIncrement = document.querySelector("#blueScore");
					blueScore++;
					scoreToIncrement.innerHTML = blueScore;
				}
				document.querySelector("#messenger p").innerHTML = "The " + player + " player has won!";
				stopGame();
				return;
			}
			
			
			// change color class
			if(playerColor === "cellFilledRed")
			{
				messager.innerHTML = "";
				playerColor = "cellFilledBlue";
				let p = document.createElement("p");
				p.innerHTML = "It is currently the Blue player's turn.";
				messager.appendChild(p);
			}
			else
			{
				messager.innerHTML = "";
				playerColor = "cellFilledRed";
				let p = document.createElement("p");
				p.innerHTML = "It is currently the Red player's turn.";
				messager.appendChild(p);
			}
		}
	}
	
	// function that checks for win
	function winCheck()
	{
		// check for win
		let win = false;
			
		// check horizontal
		let match = 0;
		for(let y = 0; y < numRows; y++)
		{
			let current;
			for (let x = 0; x < numCols; x++)
			{
				current = cells[y][x];
				// check if next element is match
				if(current.className === playerColor)
				{
					match++;
				}
				else
				{
					match = 0;
				}
				
				if(match >= 4)
				{
					win = true;
				}
			}
			match = 0;
		}			
		
		// check vertical
		match = 0;
		for(let x = 0; x < numCols; x++)
		{
			let current;
			for (let y = 0; y < numRows; y++)
			{
				current = cells[y][x];
				// check if next element is match
				if(current.className === playerColor)
				{
					match++;
				}
				else
				{
					match = 0;
				}
				
				if(match >= 4)
				{
					win = true;
				}
			}
			match = 0;
		}
			
		// check diagonals
		let Ylength = cells.length;
		let Xlength = cells[0].length;
		let maxLength = Math.max(Xlength, Ylength);
		
		for (let i = 0; i <= 2 *(maxLength - 1); ++i)
		{
			for (let y = Ylength - 1; y >= 0; --y)
			{
				let x = i - (Ylength - y);
				if (x >= 0 && x < Xlength)
				{
					current = cells[y][x];
					// check if next element is match
					if(current.className === playerColor)
					{
						match++;
					}
					else
					{
						match = 0;
					}
					
					if(match >= 4)
					{
						win = true;
					}
				}
			}
			match = 0;
		}
			
		for (let i = 0; i <= 2 *(maxLength - 1); ++i)
		{
			for (let y = Ylength - 1; y >= 0; --y)
			{
				let x = i - y;
				if (x >= 0 && x < Xlength)
				{
					current = cells[y][x];
					// check if next element is match
					if(current.className === playerColor)
					{
						match++;
					}
					else
					{
						match = 0;
					}
					
					if(match >= 4)
					{
						win = true;
					}
				}
			}
			match = 0;
		}
		
		return win;
	}
	
	// takes off all of the event listeners for the arrows in the case of a win
	function stopGame()
	{
		for(let arrow of arrows)
		{
			arrow.removeEventListener("click", fillCell);
		}
		listenersOn = false;
	}
	
	// function to reset the game on button press
	function resetGame()
	{
		// checks if listeners are on or not
		if(!listenersOn)
		{
			for(let arrow of arrows)
			{
				arrow.addEventListener("click", fillCell);
			}
			listenersOn = true;
		}
		
		// resets all of the cells to default
		for(let i = 0; i < numRows; i++)
		{
			for (let j = 0; j < numCols; j++)
			{
				cells[i][j].className = 'cell';
			}
		}
		
		// resets player color
		playerColor = "cellFilledRed";
		document.querySelector("#messenger p").innerHTML = "It is currently the Red player's turn.";
	}