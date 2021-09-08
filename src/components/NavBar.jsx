import React from 'react';
import CustomButton from './CustomButton';
import {Toolbar, Typography} from '@material-ui/core'
import {makeStyles} from "@material-ui/core/styles";
import parkUp from "../parkUp.svg";

const styles = makeStyles({
    bar:{
        paddingTop: "1.15rem",
        backgroundColor: "#fff",
        '@media (max-width:780px)': { 
           flexDirection: "column"
          }
    },
    logo: {
        width: "20%", 
        '@media (max-width:780px)': { 
           display: "none"
           }
    },
    logoMobile:{
        width: "70%", 
        display: "none", 
        '@media (max-width:780px)': { 
            display: "inline-block",
            float: "left"
            }
    },
    menuItem: {
        cursor: "pointer", 
        flexGrow: 1,
        "&:hover": {
            color:  "#4f25c8"
        },
        '@media (max-width:780px)': { 
            paddingBottom: "1rem",
            flexDirection: "column",
            flexWrap: "nowrap",
            alignContent: "stretch"
        },
        fontWeight: "600",
        fontSize: "20px",
        lineHeight: "14px",
        color: "#000",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center"
    }
})

function NavBar() {

    const classes =styles();
    return (
        <Toolbar position="sticky" color="rgba(0, 0, 0, 0.87)" className={classes.bar}>   
                <img src={parkUp} className={classes.logo} alt="logo"/>
                <img src={parkUp} className={classes.logoMobile} alt="logoMobile"/> 
                <Typography className={classes.menuItem}>
                   About
                </Typography>
                <Typography  className={classes.menuItem}>
                    Parking
                </Typography>
                <Typography  className={classes.menuItem}>
                    Contact Us 
                </Typography>
                <Typography  className={classes.menuItem}>
                    <CustomButton text="Log In" /> 
                    <span style={ {padding:"5px"}}> </span>
                    <CustomButton text="Sign Up"/>
                </Typography>
            </Toolbar>
    );
}

export default NavBar;
