const sendEmail = async (to, subject, message) => {

    console.log("Email task started...");

    console.log("To:", to);         
    console.log("Subject:", subject);
    console.log("Message:", message);

    // Simulate email processing time







    
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Email task completed successfully!");

    return {
        success: true,
        message: "Email simulated successfully",
    };

};

export default sendEmail;