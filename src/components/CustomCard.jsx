import React from 'react';

function Card(props) {
    return (
        <div>
            <h1>{props.title}</h1>
            <img src={props.imgUrl} alt=""/>
            <p>{props.details}</p>
        </div>
    );
}

export default Card;
