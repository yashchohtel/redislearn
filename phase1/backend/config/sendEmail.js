const sendEmail = async (to, subject, message) => {

    // Simulate email processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("email task completed")

    return {
        success: true,
        message: "Email simulated successfully",
    };
};

export default sendEmail;