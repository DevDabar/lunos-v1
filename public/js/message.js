const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')

$(document).ready(function () {
    $("#liveToastBtn").ready(function (event) {
        const toast = new bootstrap.Toast(toastLiveExample);
        toast.show();
    });

});