const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const { check, validationResult } = require("express-validator");
const request = require("request");
const config = require('config');

// Get my profile
router.get("/me", auth, async (req, res) => {

  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    POST api/profile
// @desc    Create or update user profile
// @access  Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build Profile object

    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills
        .toString()
        .split(",")
        .map((skill) => skill.trim());
    }

    //Build social object
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/profile
// @desc    Get all profiles
// @access  public

router.get("/", async (req, res) => {

  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);

    res.json(profiles);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route    GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  public

router.get("/user/:user_id", async (req, res) => {

  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    res.json(profile);

  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.status(500).send("Server Error");
  }
});

// DELETE User and Profile /api/profile
router.delete("/", auth, async (req, res) => {

  try {
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Add Profile
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From Date is required").not().isEmpty(),
    ],
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);

    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete experience
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {

    const profile = await Profile.findOne({ user: req.user.id });

    // const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
    // console.log('REMOVE :', removeIndex)
    // profile.experience.splice(removeIndex, 1);

    const removeExp = profile.experience.filter(
      (item) => item.id !== req.params.exp_id
    );

    profile.experience = removeExp;

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add Education
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("from", "From Date is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
    ],
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() });
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExp = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete experience
router.delete("/education/:edu_id", auth, async (req, res) => {

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
    // console.log('REMOVE :', removeIndex)
    // profile.experience.splice(removeIndex, 1);

    const removeEdu = profile.education.filter(
      (item) => item.id !== req.params.edu_id
    );

    profile.education = removeEdu;

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get api/profile/github/:username
router.get("/github/:username", async (req, res) => {

  try {
    
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&
            client_id=${config.get(
              "githubClientId"
            )}&client_secret=${config.get("githubSecret")}}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {

      if (error) {
        console.error(error);
      }

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github Profile Found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
