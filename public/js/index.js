$(document).ready(function () {


    $("i").click(function (event) {
        let iconName = event.currentTarget;
        /*
        if ($(iconName).hasClass("fa-regular")) {
            $(iconName).removeClass("fa-regular");
            $(iconName).addClass("fa-solid");
        } else {
            $(iconName).removeClass("fa-solid");
            $(iconName).addClass("fa-regular");
        }
        */
        $(iconName).effect( "bounce", { times: 3 }, "slow" );

        
        let iconList = ["item-heart","item-comment","item-bookMark"];
        if(iconList.find(iconItem => iconItem === iconName.id)){
            if ($(iconName).hasClass("fa-regular")) {
                $(iconName).removeClass("fa-regular");
                $(iconName).addClass("fa-solid");
            } else {
                $(iconName).removeClass("fa-solid");
                $(iconName).addClass("fa-regular");
            }
        }
        else{
            console.log(false);
        }       
    });

});


function changeMethod(){
    //const newForm = document.getElementById("settings-form");
    
}